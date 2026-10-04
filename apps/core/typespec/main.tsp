import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

import "./src/common/errors.tsp";
import "./src/models/user.tsp";
import "./src/routes/v1/_namespace.tsp";
import "./src/routes/v1/users.tsp";

using Http;
using TypeSpec.OpenAPI;

@service(#{ title: "cfreact-template core API" })
@info(#{ version: "1.0.0" })
@server("/", "Internal core HTTP API")
@useAuth(BearerAuth)
namespace CfreactTemplateCore;
