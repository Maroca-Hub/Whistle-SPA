import { api } from "./api";

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: File;
}

export const usersService = {
  create: ({
    firstName,
    lastName,
    email,
    profilePicture,
  }: CreateUserRequest) => {
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("profilePicture", profilePicture);

    return api.post<void>("/users", formData);
  },
};
