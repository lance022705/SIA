const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
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
`;
 
// Resolvers
const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
    post: (_, args) => prisma.post.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createPost: (_, args) => {
      return prisma.post.create({ data: { title: args.title, content: args.content } });
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
};
 
// Start the Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`Posts service running at ${url}`);
});