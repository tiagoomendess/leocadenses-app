import { defineParams } from '@sveltejs/kit/params';

/** Route parameter matchers (`[id=id]`). */
export const params = defineParams({
	/** A row id (unsigned integer): `/admin/members/12` matches, `/admin/members/create` doesn't. */
	id: (param) => {
		if (!/^[1-9]\d{0,9}$/.test(param)) return undefined;
		const id = Number(param);
		return id <= 4_294_967_295 ? id : undefined;
	}
});
