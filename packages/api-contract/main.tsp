import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using TypeSpec.OpenAPI;

@service(#{ title: "cfreact-template API" })
@info(#{ version: "1.0.0" })
@server("/", "Default server")
namespace CfreactTemplate;

model ErrorResponse {
  error: string;
}

model HelloResponse {
  message: string;
  timestamp: utcDateTime;
}

model User {
  id: int64;
  name: string;
  @format("email") email: string;
  createdAt: utcDateTime;
}

model CreateUserInput {
  name: string;
  @format("email") email: string;
}

@route("/api")
namespace Api {
  @tag("hello")
  @summary("Returns greeting")
  @operationId("getHello")
  @get
  @route("/hello")
  op getHello(): {
    @statusCode statusCode: 200;
    @body body: HelloResponse;
  };

  @tag("users")
  @summary("List all users")
  @operationId("listUsers")
  @get
  @route("/users")
  op listUsers(): {
    @statusCode statusCode: 200;
    @body body: User[];
  };

  @tag("users")
  @summary("Create a new user")
  @operationId("createUser")
  @post
  @route("/users")
  op createUser(@body body: CreateUserInput): {
    @statusCode statusCode: 201;
    @body body: User;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @tag("users")
  @summary("Get a user by id")
  @operationId("getUser")
  @get
  @route("/users/{id}")
  op getUser(@path id: int64): {
    @statusCode statusCode: 200;
    @body body: User;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}
