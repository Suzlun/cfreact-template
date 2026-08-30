import "@typespec/http";
import "@typespec/openapi";

using Http;
using TypeSpec.OpenAPI;

namespace CfreactTemplate;

@tag("health")
@summary("Returns service health")
@operationId("getHealth")
@get
@route("/health")
op getHealth():
  | {
      @statusCode statusCode: 200;
      @body body: HealthResponse;
    }
  | {
      @statusCode statusCode: 500;
      @body body: InternalError;
    };
