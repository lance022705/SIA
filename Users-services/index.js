const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GraphQL Schema for Users
const typeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
    age: Int!
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
  }

  type Mutation {
    createUser(name: String!, email: String!, age: Int!): User!
    updateUser(id: Int!, name: String, email: String, age: Int): User
    deleteUser(id: Int!): User
  }
`;

// Resolvers for CRUD operations using Prisma
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, args) => prisma.user.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createUser: (_, args) => prisma.user.create({ data: args }),
    updateUser: async (_, args) => {
      const { id, ...data } = args;
      return prisma.user.update({ where: { id }, data });
    },
    deleteUser: (_, args) => prisma.user.delete({ where: { id: args.id } }),
  },
};

// Create Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server on port 4001
server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`Users service ready at ${url}`);
});
