<script lang="ts">
	import { Alert, Button, Checkbox, Helper, Input, Label, Select } from 'flowbite-svelte';
	import { CheckCircleSolid, PaperPlaneOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import Turnstile from '#lib/components/Turnstile.svelte';
	import { isFormFailure, type FormFailure } from '#lib/forms.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);
	let turnstileReset = $state(0);

	const submitted = $derived(data.submitted || (form && 'submitted' in form && form.submitted));
	const failure: FormFailure | null = $derived(isFormFailure(form) ? (form as FormFailure) : null);
	const values = $derived(failure?.values ?? {});
	const fieldError = (name: string) => failure?.errors[name]?.[0];

	const documentOptions = $derived(
		data.documentTypes.map((type) => ({ value: String(type.id), name: type.name }))
	);
</script>

<Seo title={m.member_title()} description={m.member_description()} />

<h1 class="mb-4 text-3xl font-extrabold tracking-tight">{m.member_title()}</h1>

{#if data.body}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised on the server (renderHtml) -->
	<div class="cms mb-5 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-900">{@html data.body}</div>
{/if}

{#if submitted}
	<section
		class="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-gray-900"
		aria-live="polite"
	>
		<CheckCircleSolid class="size-14 text-primary-600" />
		<h2 class="text-xl font-bold">{m.member_success_title()}</h2>
		<p class="text-gray-600 dark:text-gray-300">{m.member_success()}</p>
		<Button href={resolve('/(site)')} pill>{m.card_go_site()}</Button>
	</section>
{:else}
	<form
		method="POST"
		class="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6 dark:bg-gray-900"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
				turnstileReset += 1;
			};
		}}
	>
		<h2 class="text-lg font-bold">{m.member_form_title()}</h2>

		{#if failure?.message}
			<Alert color="red" role="alert">{failure.message}</Alert>
		{/if}

		<div>
			<Label for="name" class="mb-2">{m.member_name()}</Label>
			<Input
				id="name"
				name="nome"
				autocomplete="name"
				required
				minlength={5}
				maxlength={60}
				value={values.nome ?? ''}
				color={fieldError('nome') ? 'red' : 'default'}
			/>
			{#if fieldError('nome')}<Helper class="mt-2" color="red">{fieldError('nome')}</Helper>{/if}
		</div>

		<div class="grid gap-5 sm:grid-cols-2">
			<div>
				<Label for="phone" class="mb-2">{m.member_phone()}</Label>
				<Input
					id="phone"
					name="telefone"
					type="tel"
					inputmode="tel"
					autocomplete="tel"
					required
					minlength={9}
					maxlength={30}
					value={values.telefone ?? ''}
					color={fieldError('telefone') ? 'red' : 'default'}
				/>
				{#if fieldError('telefone')}
					<Helper class="mt-2" color="red">{fieldError('telefone')}</Helper>
				{/if}
			</div>
			<div>
				<Label for="email" class="mb-2">{m.member_email()}</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					maxlength={50}
					value={values.email ?? ''}
					color={fieldError('email') ? 'red' : 'default'}
				/>
				{#if fieldError('email')}
					<Helper class="mt-2" color="red">{fieldError('email')}</Helper>
				{/if}
			</div>
		</div>

		<div class="grid gap-5 sm:grid-cols-[10rem_1fr]">
			<div>
				<Label for="document-type" class="mb-2">{m.member_document_type()}</Label>
				<Select
					id="document-type"
					name="document_type"
					required
					items={documentOptions}
					value={values.document_type ?? documentOptions[0]?.value}
					placeholder=""
				/>
				{#if fieldError('document_type')}
					<Helper class="mt-2" color="red">{fieldError('document_type')}</Helper>
				{/if}
			</div>
			<div>
				<Label for="document" class="mb-2">{m.member_document()}</Label>
				<Input
					id="document"
					name="documento"
					required
					minlength={6}
					maxlength={50}
					value={values.documento ?? ''}
					color={fieldError('documento') ? 'red' : 'default'}
				/>
				{#if fieldError('documento')}
					<Helper class="mt-2" color="red">{fieldError('documento')}</Helper>
				{/if}
			</div>
		</div>

		<div>
			<Label for="address" class="mb-2">{m.member_address()}</Label>
			<Input
				id="address"
				name="address"
				autocomplete="street-address"
				required
				minlength={6}
				maxlength={100}
				value={values.address ?? ''}
				color={fieldError('address') ? 'red' : 'default'}
			/>
			{#if fieldError('address')}
				<Helper class="mt-2" color="red">{fieldError('address')}</Helper>
			{/if}
		</div>

		<div>
			<Checkbox name="authorization" required checked={values.authorization === 'on'}>
				{m.member_consent()}
			</Checkbox>
			{#if fieldError('authorization')}
				<Helper class="mt-2" color="red">{fieldError('authorization')}</Helper>
			{/if}
		</div>

		<Turnstile siteKey={data.turnstileSiteKey} resetKey={turnstileReset} />

		<Button type="submit" class="w-full sm:w-auto" pill loading={submitting}>
			<PaperPlaneOutline class="me-2 size-5 rtl:rotate-180" />
			{m.member_submit()}
		</Button>
	</form>
{/if}
