namespace CfreactTemplateCore;

model InvalidRequestError {
  code: "INVALID_REQUEST";
  message: string;
}

model UserNotFoundError {
  code: "USER_NOT_FOUND";
  message: string;
}

model UserEmailAlreadyExistsError {
  code: "USER_EMAIL_ALREADY_EXISTS";
  message: string;
}

model InternalError {
  code: "INTERNAL_ERROR";
  message: string;
}
