export enum UserPermission {
  Create = "usr_Create",
  Edit = "usr_Edit",
}

export enum PostPermission {
  Edit = "post_Edit",
  EditAny = "post_EditAny",
}

export enum PhotoPermission {
  Upload = "photo_Upload",
  Edit = "photo_Edit",
  EditAny = "photo_EditAny",
  Delete = "photo_Delete",
  DeleteAny = "photo_DeleteAny",
  ViewPrivate = "photo_ViewPrivate",
}

export enum AlbumPermission {
  Create = "album_Create",
  Edit = "album_Edit",
  EditAny = "album_EditAny",
  Delete = "album_Delete",
  DeleteAny = "album_DeleteAny",
  ViewPrivate = "album_ViewPrivate",
}

export enum TagPermission {
  Create = "tag_Create",
  Edit = "tag_Edit",
  Delete = "tag_Delete",
}

export enum ThemePermission {
  Create = "theme_Create",
  Edit = "theme_Edit",
  Delete = "theme_Delete",
  Activate = "theme_Activate",
}

export type Permission = UserPermission | PostPermission | PhotoPermission | AlbumPermission | TagPermission | ThemePermission
