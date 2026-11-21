/**
 * StorageService
 * Manages LocalStorage persistence with namespaced keys.
 * Single Responsibility: Storage I/O and serialization.
 */
export class StorageService {
	static #PREFIX = "ignou_fp_";

	static get(key, defaultValue = null) {
		try {
			const raw = localStorage.getItem(this.#PREFIX + key);
			return raw !== null ? JSON.parse(raw) : defaultValue;
		} catch (e) {
			console.warn(`StorageService read error for key "${key}":`, e);
			return defaultValue;
		}
	}

	static set(key, value) {
		try {
			localStorage.setItem(this.#PREFIX + key, JSON.stringify(value));
		} catch (e) {
			console.error(`StorageService write error for key "${key}":`, e);
		}
	}

	static remove(key) {
		try {
			localStorage.removeItem(this.#PREFIX + key);
		} catch (e) {
			console.error(`StorageService remove error for key "${key}":`, e);
		}
	}
}
