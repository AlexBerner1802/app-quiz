export function createTimestamp(time, edited) {
	const date = new Date(Date.parse(time));
	const seconds = Math.floor((new Date() - date) / 1000);
	let interval = seconds / 31536000;
	let type = edited ? "Modifié " : "Créé ";

	function result(i, str) {
		const value = Math.floor(i);
		if (value > 1 && str[str.length - 1] !== "s") {
			return `il y a ${value} ${str.split(/\s/)[0]}s`;
		}
		return `il y a ${value} ${str}`;
	}

	if (interval > 1) return type + result(interval, "année");
	interval = seconds / 2592000;
	if (interval > 1) return type + result(interval, "mois");
	interval = seconds / 86400;
	if (interval > 1) return type + result(interval, "jour");
	interval = seconds / 3600;
	if (interval > 1) return type + result(interval, "heure");
	interval = seconds / 60;
	if (interval > 1) return type + result(interval, "minute");
	return type + result(seconds, "seconde");
}


export function formatDate(isoString) {
	if (!isoString) return "";
	const date = new Date(isoString);

	const pad = (n) => n.toString().padStart(2, "0");

	const day = pad(date.getDate());
	const month = pad(date.getMonth() + 1); // months are 0-indexed
	const year = date.getFullYear();
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());

	return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatTime(seconds) {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	const pad = (num) => String(num).padStart(2, '0');

	return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}