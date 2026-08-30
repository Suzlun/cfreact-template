import "@typespec/openapi";

using TypeSpec.OpenAPI;

namespace CfreactTemplate;

@format("ulid")
@pattern("^[0-9A-HJKMNP-TV-Z]{26}$")
@minLength(26)
@maxLength(26)
scalar UserId extends string;

model User {
  id: UserId;
  name: string;
  @format("email") email: string;
  createdAt: utcDateTime;
}

model CreateUserInput {
  name: string;
  @format("email") email: string;
}
