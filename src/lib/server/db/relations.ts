import { relations } from 'drizzle-orm';
import {
	categories,
	documentTypes,
	memberApplication,
	members,
	menuItems,
	menus,
	permissionRole,
	permissions,
	posts,
	quotaPayments,
	quotas,
	roles,
	userRoles,
	users
} from './schema';

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	parent: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: 'categoryParent'
	}),
	children: many(categories, { relationName: 'categoryParent' }),
	posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
	category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
	author: one(users, { fields: [posts.authorId], references: [users.id] })
}));

export const documentTypesRelations = relations(documentTypes, ({ many }) => ({
	members: many(members),
	applications: many(memberApplication)
}));

export const membersRelations = relations(members, ({ one, many }) => ({
	documentType: one(documentTypes, {
		fields: [members.documentTypeId],
		references: [documentTypes.id]
	}),
	payments: many(quotaPayments)
}));

export const memberApplicationRelations = relations(memberApplication, ({ one }) => ({
	documentType: one(documentTypes, {
		fields: [memberApplication.documentTypeId],
		references: [documentTypes.id]
	})
}));

export const quotasRelations = relations(quotas, ({ many }) => ({
	payments: many(quotaPayments)
}));

export const quotaPaymentsRelations = relations(quotaPayments, ({ one }) => ({
	member: one(members, { fields: [quotaPayments.memberId], references: [members.id] }),
	quota: one(quotas, { fields: [quotaPayments.quotaId], references: [quotas.id] })
}));

export const menusRelations = relations(menus, ({ many }) => ({
	items: many(menuItems)
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
	menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] })
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	permissions: many(permissionRole),
	users: many(users),
	userRoles: many(userRoles)
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	roles: many(permissionRole)
}));

export const permissionRoleRelations = relations(permissionRole, ({ one }) => ({
	permission: one(permissions, {
		fields: [permissionRole.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, { fields: [permissionRole.roleId], references: [roles.id] })
}));

export const usersRelations = relations(users, ({ one, many }) => ({
	role: one(roles, { fields: [users.roleId], references: [roles.id] }),
	extraRoles: many(userRoles),
	posts: many(posts)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, { fields: [userRoles.userId], references: [users.id] }),
	role: one(roles, { fields: [userRoles.roleId], references: [roles.id] })
}));
