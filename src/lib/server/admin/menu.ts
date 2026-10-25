import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/index.ts';
import { menuItems, menus } from '#lib/server/db/schema.ts';
import { parseForm } from '#lib/server/forms.ts';
import { integer, optionalId, requiredText } from '#lib/server/validation.ts';
import { rejected, type SaveResult } from './crud';
import { oneOf } from './fields';

/** Only the `site` menu matters now (the `admin` one was Voyager's own sidebar). */
export async function siteMenuId(): Promise<number> {
	const [menu] = await db
		.select({ id: menus.id })
		.from(menus)
		.where(eq(menus.name, 'site'))
		.limit(1);
	if (menu) return menu.id;
	const [created] = await db.insert(menus).values({ name: 'site' }).$returningId();
	return created.id;
}

export type MenuNode = {
	id: number;
	title: string;
	url: string;
	target: string;
	order: number;
	children: MenuNode[];
};

/** The site menu as a tree (top-level items with their sub-items), in menu order. */
export async function siteMenuTree(): Promise<MenuNode[]> {
	const menuId = await siteMenuId();
	const rows = await db
		.select({
			id: menuItems.id,
			title: menuItems.title,
			url: menuItems.url,
			target: menuItems.target,
			order: menuItems.order,
			parentId: menuItems.parentId
		})
		.from(menuItems)
		.where(eq(menuItems.menuId, menuId))
		.orderBy(asc(menuItems.order), asc(menuItems.id));
	const nodes = new Map(rows.map((row) => [row.id, { ...row, children: [] as MenuNode[] }]));
	const roots: MenuNode[] = [];
	for (const node of nodes.values()) {
		const parent = node.parentId ? nodes.get(node.parentId) : undefined;
		if (parent) parent.children.push(node);
		else roots.push(node);
	}
	return roots;
}

export async function topLevelItems(exceptId: number | null = null) {
	const menuId = await siteMenuId();
	const rows = await db
		.select({ id: menuItems.id, title: menuItems.title })
		.from(menuItems)
		.where(and(eq(menuItems.menuId, menuId), isNull(menuItems.parentId)))
		.orderBy(asc(menuItems.order));
	return rows.filter((row) => row.id !== exceptId);
}

export async function findMenuItem(id: number) {
	const menuId = await siteMenuId();
	const [row] = await db
		.select()
		.from(menuItems)
		.where(and(eq(menuItems.id, id), eq(menuItems.menuId, menuId)))
		.limit(1);
	return row ?? null;
}

/** Site paths (`/pages/palmares`), `#` for a heading, or full links. */
const menuUrl = requiredText(191).pipe(
	z.string().refine((value) => /^(\/|#$|https?:\/\/|mailto:)/.test(value), {
		error: () => 'Use um caminho do site (/pages/…), # ou uma ligação https://.'
	})
);

const MenuItemForm = z.object({
	title: requiredText(191),
	url: menuUrl,
	target: oneOf(['_self', '_blank']),
	parent_id: optionalId(),
	order: integer(0, 10_000)
});

export async function saveMenuItem(
	formData: FormData,
	existing: { id: number } | null
): Promise<SaveResult<{ id: number; title: string }>> {
	const form = parseForm(MenuItemForm, formData);
	if (!form.success) return rejected(form.errors, form.values);
	const data = form.data;
	if (data.parent_id !== null) {
		const parents = await topLevelItems(existing?.id ?? null);
		if (!parents.some((parent) => parent.id === data.parent_id)) {
			return rejected({ parent_id: ['Escolha um item de primeiro nível.'] }, form.values);
		}
	}
	const values = {
		title: data.title,
		url: data.url,
		target: data.target,
		parentId: data.parent_id,
		order: data.order
	};
	if (existing) {
		await db.update(menuItems).set(values).where(eq(menuItems.id, existing.id));
		return { ok: true, id: existing.id, title: values.title };
	}
	const [created] = await db
		.insert(menuItems)
		.values({ ...values, menuId: await siteMenuId() })
		.$returningId();
	return { ok: true, id: created.id, title: values.title };
}

export async function hasChildren(id: number) {
	const [child] = await db
		.select({ id: menuItems.id })
		.from(menuItems)
		.where(eq(menuItems.parentId, id))
		.limit(1);
	return Boolean(child);
}

export async function deleteMenuItem(id: number) {
	await db.delete(menuItems).where(eq(menuItems.id, id));
}
