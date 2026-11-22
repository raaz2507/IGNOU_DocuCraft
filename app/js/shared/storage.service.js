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

	static getAllPrefixed() {
		const result = {};
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const fullKey = localStorage.key(i);
				if (fullKey && fullKey.startsWith(this.#PREFIX)) {
					const shortKey = fullKey.slice(this.#PREFIX.length);
					try {
						result[shortKey] = JSON.parse(localStorage.getItem(fullKey));
					} catch {
						result[shortKey] = localStorage.getItem(fullKey);
					}
				}
			}
		} catch (e) {
			console.error("StorageService getAllPrefixed error:", e);
		}
		return result;
	}

	static clearPrefixed() {
		try {
			const toRemove = [];
			for (let i = 0; i < localStorage.length; i++) {
				const fullKey = localStorage.key(i);
				if (fullKey && fullKey.startsWith(this.#PREFIX)) {
					toRemove.push(fullKey);
				}
			}
			toRemove.forEach((k) => localStorage.removeItem(k));
		} catch (e) {
			console.error("StorageService clearPrefixed error:", e);
		}
	}
}
