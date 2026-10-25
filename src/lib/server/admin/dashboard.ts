import { and, asc, count, desc, eq, isNull, lte, gt } from 'drizzle-orm';
import { nowNaive } from '#lib/dates.ts';
import { db } from '#lib/server/db/index.ts';
import { memberApplication, members, posts, quotaPayments, quotas } from '#lib/server/db/schema.ts';

/** The season being paid now: the last quota already due, or else the first one coming. */
export async function currentQuota() {
	const now = nowNaive();
	const [due] = await db
		.select({ id: quotas.id, name: quotas.name, dueDate: quotas.dueDate })
		.from(quotas)
		.where(lte(quotas.dueDate, now))
		.orderBy(desc(quotas.dueDate))
		.limit(1);
	if (due) return due;
	const [next] = await db
		.select({ id: quotas.id, name: quotas.name, dueDate: quotas.dueDate })
		.from(quotas)
		.where(gt(quotas.dueDate, now))
		.orderBy(asc(quotas.dueDate))
		.limit(1);
	return next ?? null;
}

export async function dashboardCounts() {
	const quota = await currentQuota();
	const active = isNull(members.deletedAt);
	const [[memberCount], [applications], [pendingCards], [published], paid] = await Promise.all([
		db.select({ value: count() }).from(members).where(active),
		db.select({ value: count() }).from(memberApplication),
		db
			.select({ value: count() })
			.from(members)
			.where(and(active, eq(members.generateCard, true))),
		db.select({ value: count() }).from(posts).where(eq(posts.status, 'PUBLISHED')),
		quota
			? db
					.selectDistinct({ memberId: quotaPayments.memberId })
					.from(quotaPayments)
					.innerJoin(members, eq(members.id, quotaPayments.memberId))
					.where(and(eq(quotaPayments.quotaId, quota.id), active))
			: Promise.resolve([])
	]);
	return {
		members: memberCount.value,
		applications: applications.value,
		pendingCards: pendingCards.value,
		publishedPosts: published.value,
		quota: quota ? { name: quota.name, paid: paid.length } : null
	};
}
