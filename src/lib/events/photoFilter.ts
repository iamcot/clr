export type PhotoOwnership = { taggedMe: boolean }

export function filterMyPhotos<Photo extends PhotoOwnership>(photos: Photo[]): Photo[] {
  return photos.filter((photo) => photo.taggedMe)
}
