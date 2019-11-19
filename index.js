const express = require("express");
const http = require("http");
const {
  ApolloServer,
  gql,
  PubSub,
  withFilter
} = require("apollo-server-express");

const pubsub = new PubSub();

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type messages {
    message: String
    room: String
  }
  type Subscription {
    subscribeMessage(room: String): messages
  }
  type Mutation {
    addMessage(message: String, room: String): messages
  }
  type Query {
    hello: String
  }
`;

const channel = "sub_message";
// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => "Hello world!"
  },
  Subscription: {
    subscribeMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([channel]),
        (payload, variable) => {
          console.log(payload);
          console.log(variable);
          return variable.room === payload.subscribeMessage.room;
        }
      )
    }
  },
  Mutation: {
    addMessage: (_, data) => {
      pubsub.publish(channel, { subscribeMessage: data });
      return data;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);
server.applyMiddleware({ app });

httpServer.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
