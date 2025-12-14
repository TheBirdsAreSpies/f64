export enum UserPermission {
  Create = "usr_Create",
  Edit = "usr_Edit",
}

export enum PostPermission {
  Edit = "post_Edit",
  EditAny = "post_EditAny",
}

export type Permission = UserPermission | PostPermission
