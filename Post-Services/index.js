const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const { PubSub } = require('graphql-subscriptions'); // Make sure this is correctly imported
const { createServer } = require('http');
const { useServer } = require('graphql-ws');
const { WebSocketServer } = require('ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const prisma = new PrismaClient();
const pubsub = new PubSub(); // Ensure this is correctly instantiated

// GraphQL Schema
const typeDefs = gql`
  type Post {
    id: Int!
    title: String!
    content: String!
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post
  }

  type Mutation {
    createPost(title: String!, content: String!): Post!
    updatePost(id: Int!, title: String, content: String): Post!
    deletePost(id: Int!): Post!
  }

  type Subscription {
    postAdded: Post!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
    post: (_, args) => prisma.post.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createPost: async (_, args) => {
      const newPost = await prisma.post.create({
        data: { title: args.title, content: args.content },
      });

      pubsub.publish("POST_ADDED", { postAdded: newPost }); // Publish event

      return newPost;
    },
    updatePost: (_, args) => {
      return prisma.post.update({
        where: { id: args.id },
        data: { title: args.title, content: args.content },
      });
    },
    deletePost: (_, args) => {
      return prisma.post.delete({ where: { id: args.id } });
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(["POST_ADDED"]), // Ensure asyncIterator is properly called
    },
  },
};

// Create an executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create a WebSocket server
const httpServer = createServer();
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
useServer({ schema }, wsServer);

// Start the Apollo Server
const server = new ApolloServer({ schema });

httpServer.listen(4002, () => {
  console.log(`🚀 WebSocket & HTTP Server running at http://localhost:4002/graphql`);
});
