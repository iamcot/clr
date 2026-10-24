export type PhotoOwnership = { uploadedByMe: boolean; taggedMe: boolean }

export function isMyPhoto(photo: PhotoOwnership): boolean {
  return photo.uploadedByMe || photo.taggedMe
}

export function filterMyPhotos<Photo extends PhotoOwnership>(photos: Photo[]): Photo[] {
  return photos.filter(isMyPhoto)
}
