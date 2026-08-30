import "@typespec/http";
import "@typespec/openapi";

using Http;
using TypeSpec.OpenAPI;

namespace CfreactTemplateCore.ApiV1;

@tag("users")
@operationId("listUsers")
@get
@route("/users")
op listUsers():
  | {
      @statusCode statusCode: 200;
      @body body: CfreactTemplateCore.User[];
    }
  | {
      @statusCode statusCode: 500;
      @body body: CfreactTemplateCore.InternalError;
    };

@tag("users")
@operationId("createUser")
@post
@route("/users")
op createUser(@body body: CfreactTemplateCore.CreateUserInput):
  | {
      @statusCode statusCode: 201;
      @body body: CfreactTemplateCore.User;
    }
  | {
      @statusCode statusCode: 400;
      @body body: CfreactTemplateCore.InvalidRequestError;
    }
  | {
      @statusCode statusCode: 409;
      @body body: CfreactTemplateCore.UserEmailAlreadyExistsError;
    }
  | {
      @statusCode statusCode: 500;
      @body body: CfreactTemplateCore.InternalError;
    };

@tag("users")
@operationId("getUser")
@get
@route("/users/{id}")
op getUser(@path id: CfreactTemplateCore.UserId):
  | {
      @statusCode statusCode: 200;
      @body body: CfreactTemplateCore.User;
    }
  | {
      @statusCode statusCode: 400;
      @body body: CfreactTemplateCore.InvalidRequestError;
    }
  | {
      @statusCode statusCode: 404;
      @body body: CfreactTemplateCore.UserNotFoundError;
    }
  | {
      @statusCode statusCode: 500;
      @body body: CfreactTemplateCore.InternalError;
    };
