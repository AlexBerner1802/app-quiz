export function buildQuizFormData(payload = {}) {
	const fd = new FormData();

	if (payload.cover_image_file instanceof File || payload.cover_image_file instanceof Blob) {
		fd.append("cover_image_file", payload.cover_image_file);
	}

	if (payload.cover_image_url !== undefined && payload.cover_image_url !== null) {
		fd.append("cover_image_url", payload.cover_image_url);
	}

	if (payload.translations) {
		fd.append("translations", JSON.stringify(payload.translations));
	}

	if (payload.id_owner) {
		fd.append("id_owner", payload.id_owner);
	}

	return fd;
}
