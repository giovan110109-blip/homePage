import service from "@/api/request";

const photoDetailCache = new Map<string, any>();
const inflightPhotoDetailRequests = new Map<string, Promise<any>>();

const hasCompletePhotoDetail = (photo: any) => {
  if (!photo || typeof photo !== "object") return false;
  const exif = photo.exif;
  return Boolean(
    exif &&
      typeof exif === "object" &&
      Object.keys(exif).length > 0 &&
      (photo.location || photo.fileSize || photo.baseName),
  );
};

const mergePhotoDetail = (basePhoto: any, detailPhoto: any) => ({
  ...(basePhoto || {}),
  ...(detailPhoto || {}),
});

export const getCachedPhotoDetail = (photoId?: string | null) => {
  if (!photoId) return null;
  const cached = photoDetailCache.get(photoId) ?? null;
  return hasCompletePhotoDetail(cached) ? cached : null;
};

export const setCachedPhotoDetail = (photoId: string, photo: any) => {
  if (!photoId) return;
  if (!hasCompletePhotoDetail(photo)) return;
  photoDetailCache.set(photoId, photo);
};

export const fetchPhotoDetail = async (photo: any) => {
  const photoId = photo?._id;
  if (!photoId) return photo;

  const cached = getCachedPhotoDetail(photoId);
  if (cached) {
    return mergePhotoDetail(photo, cached);
  }

  const inflightRequest = inflightPhotoDetailRequests.get(photoId);
  if (inflightRequest) {
    const detailPhoto = await inflightRequest;
    return mergePhotoDetail(photo, detailPhoto);
  }

  const requestPromise = service
    .get(`/photos/${photoId}`)
    .then((res: any) => {
      const detailPhoto = res?.success && res.data ? res.data : photo;
      setCachedPhotoDetail(photoId, mergePhotoDetail(photo, detailPhoto));
      return detailPhoto;
    })
    .finally(() => {
      inflightPhotoDetailRequests.delete(photoId);
    });

  inflightPhotoDetailRequests.set(photoId, requestPromise);

  const detailPhoto = await requestPromise;
  return mergePhotoDetail(photo, detailPhoto);
};
