const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const imagekit = require('../libs/imagekit');
const path = require('path');

module.exports = {
  createPost: async (req, res, next) => {
    try {
      const { title, body } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required',
          data: null,
        });
      }

      const strFile = req.file.buffer.toString('base64');

      const { url, fileId } = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
      });

      const create = await prisma.posts.create({
        data: {
          title,
          body,
          image: {
            create: {
              image_id: fileId,
              url,
            },
          },
        },
        include: {
          image: true,
        },
      });

      res
        .status(201)
        .json({ success: true, message: 'Post created', data: create });
    } catch (error) {
      next(error);
    }
  },

  getPostById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const getPost = await prisma.posts.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          image: true,
        },
      });

      if (!getPost)
        return res.status(404).json({
          success: false,
          message: 'Post with that id is not found',
          data: null,
        });

      res
        .status(200)
        .json({ success: true, message: 'Post found', data: getPost });
    } catch (err) {
      next(err);
    }
  },

  getAllPosts: async (req, res, next) => {
    try {
      const getPosts = await prisma.posts.findMany({
        include: {
          image: true,
        },
      });

      if (getPosts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Posts not found',
          data: null,
        });
      }

      res
        .status(200)
        .json({ success: true, message: 'Post found', data: getPosts });
    } catch (err) {
      next(err);
    }
  },

  updatePostById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, body } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required',
          data: null,
        });
      }

      const isPostExists = await prisma.posts.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!isPostExists)
        return res
          .status(404)
          .json({ success: false, message: 'Post not found', data: null });

      const updatePost = await prisma.posts.update({
        where: {
          id: parseInt(id),
        },
        data: {
          title,
          body,
        },
      });

      res
        .status(200)
        .json({ success: true, message: 'Post is updated', data: updatePost });
    } catch (err) {
      next(err);
    }
  },

  deletePost: async (req, res, next) => {
    try {
      const { id } = req.params;

      const isPostExists = await prisma.posts.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          image: true,
        },
      });

      if (!isPostExists)
        return res
          .status(404)
          .json({ success: false, message: 'Post not found', data: null });

      await imagekit.deleteFile(isPostExists.image.image_id);

      await prisma.images.delete({
        where: {
          post_id: parseInt(id),
        },
      });

      const remove = await prisma.posts.delete({
        where: {
          id: parseInt(id),
        },
      });

      res
        .status(200)
        .json({ success: true, message: 'Post is deleted', data: remove });
    } catch (err) {
      next(err);
    }
  },
};
