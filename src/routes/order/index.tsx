import { createFileRoute } from '@tanstack/react-router'

import { type } from "arktype"

import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const FormSchema = type({
    // Personal
    name: "string > 0",
    email: "string.email",
    phoneNumber: "string.numeric > 7",

    // Vehicle
    vehicleBrand: "string > 0",
    vehicleModel: "string > 0",
    vehicleYear: "string.digits > 3",
    vehicleVin: "string.alphanumeric",

    // Mechanic
    mechanicName: "string > 0",
    mechanicPhone: "string.numeric > 7",
    mechanicEmail: "string.email?",

    // Parts
    partName: "string > 0",
    partDescription: "string > 0",
    partQuantity: "number.integer > 0",
    partOtherInformation: "string?",

    // Additional
    engineSize: "string?",
    comments: "string?",
})

type FormValues = typeof FormSchema.infer


export const Route = createFileRoute('/order/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div className='mx-auto w-full max-w-2xl p-4'>
        <OrderForm />
    </div>
}

import { useForm } from "@tanstack/react-form"
import { toast } from 'sonner'
import { createServerFn } from '@tanstack/react-start'

// Server function: persist an order + vehicle + (single) part
// NOTE: We use dynamic imports inside the handler so DB code stays server-only.
export const submitOrderToDb = createServerFn({ method: 'POST' })
    .inputValidator((data: FormValues) => data)
    .handler(async ({ data }) => {
        // Adjust these imports if your project uses different paths
        const { db } = await import('@/server/db/index')
        const {
            ordersTable,
            vehiclesTable,
            orderPartsTable,
        } = await import('@/server/db/schema/schema')

        const result = await db.transaction(async (tx: any) => {
            const insertedOrders = await tx
                .insert(ordersTable)
                .values({
                    customerName: data.name,
                    customerEmail: data.email,
                    customerPhone: data.phoneNumber,

                    mechanicName: data.mechanicName,
                    mechanicPhone: data.mechanicPhone,
                    mechanicEmail: data.mechanicEmail || null,

                    status: 'pending',
                    customerComments: data.comments || null,
                    adminNotes: null,
                })
                .returning({ id: ordersTable.id })

            const orderId = insertedOrders?.[0]?.id
            if (!orderId) {
                throw new Error('Failed to create order')
            }

            await tx.insert(vehiclesTable).values({
                orderId,
                make: data.vehicleBrand,
                model: data.vehicleModel,
                year: Number(data.vehicleYear),
                vin: data.vehicleVin || null,
            })

            // MVP: single part (later this becomes a field array)
            await tx.insert(orderPartsTable).values({
                orderId,
                name: data.partName,
                description: data.partDescription,
                quantity: data.partQuantity,
            })

            return { orderId }
        })

        return result
    })



const defaultFormValues: FormValues = {
    name: "",
    email: "",
    phoneNumber: "",

    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleVin: "",

    mechanicName: "",
    mechanicPhone: "",
    mechanicEmail: "",

    partName: "",
    partDescription: "",
    partQuantity: 1,
    partOtherInformation: "",

    engineSize: "",
    comments: "",
}

function OrderForm() {
    const form = useForm({
        defaultValues: defaultFormValues,
        validators: {
            onSubmit: FormSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                const res = await submitOrderToDb({ data: value })

                toast.success('Order submitted!', {
                    description: (
                        <div className="flex flex-col gap-2">
                            <div>Order ID: <strong>{res.orderId}</strong></div>
                            <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
                                <code>{JSON.stringify(value, null, 2)}</code>
                            </pre>
                        </div>
                    ),
                    position: 'bottom-right',
                    classNames: {
                        content: 'flex flex-col gap-2',
                    },
                    style: {
                        '--border-radius': 'calc(var(--radius)  + 4px)',
                    } as React.CSSProperties,
                })

                form.reset()
            } catch (err: any) {
                toast.error('Failed to submit order', {
                    description: err?.message ?? 'Unknown error',
                    position: 'bottom-right',
                })
            }
        },
    })

    return <form
        id="order-form"
        onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
        }}>
        <FieldGroup>
            <FieldSet>
                <FieldLegend>Personal Information</FieldLegend>
                <FieldGroup>
                    <form.Field
                        name="name"
                        children={(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="personal-name">Name</FieldLabel>
                                    <Input
                                        id="personal-name"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="name"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="email"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="personal-email">Email</FieldLabel>
                                    <Input
                                        id="personal-email"
                                        name={field.name}
                                        type="email"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="email"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="phoneNumber"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="personal-phone">Phone</FieldLabel>
                                    <Input
                                        id="personal-phone"
                                        name={field.name}
                                        type="tel"
                                        inputMode="tel"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="tel"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                </FieldGroup>
            </FieldSet>
            <FieldSet>
                <FieldLegend>Vehicle Details</FieldLegend>
                <FieldGroup>
                    <form.Field
                        name="vehicleBrand"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="vehicle-brand">Brand</FieldLabel>
                                    <Input
                                        id="vehicle-brand"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="vehicleModel"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="vehicle-model">Model</FieldLabel>
                                    <Input
                                        id="vehicle-model"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="vehicleYear"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="vehicle-year">Year</FieldLabel>
                                    <Input
                                        id="vehicle-year"
                                        name={field.name}
                                        type="text"
                                        inputMode="numeric"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="off"
                                    />
                                    <FieldDescription>Enter a 4-digit year.</FieldDescription>
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="vehicleVin"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="vehicle-vin">VIN</FieldLabel>
                                    <Input
                                        id="vehicle-vin"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                </FieldGroup>
            </FieldSet>
            {/* Mechanic Information */}
            <FieldSet>
                <FieldLegend>Mechanic Information</FieldLegend>
                <FieldGroup>
                    <form.Field
                        name="mechanicName"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="mechanic-name">Name</FieldLabel>
                                    <Input
                                        id="mechanic-name"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="name"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="mechanicPhone"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="mechanic-phone">Phone</FieldLabel>
                                    <Input
                                        id="mechanic-phone"
                                        name={field.name}
                                        type="tel"
                                        inputMode="tel"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="tel"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="mechanicEmail"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="mechanic-email">Email</FieldLabel>
                                    <Input
                                        id="mechanic-email"
                                        name={field.name}
                                        type="email"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        autoComplete="email"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                </FieldGroup>
            </FieldSet>
            {/* TODO: Field Array for multiple parts */}
            <FieldSet>
                <FieldLegend>Parts</FieldLegend>
                <FieldGroup>
                    <form.Field
                        name="partName"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="part-name">Name</FieldLabel>
                                    <Input
                                        id="part-name"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="partDescription"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="part-description">Description</FieldLabel>
                                    <Textarea
                                        id="part-description"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        aria-required
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="partQuantity"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="part-quantity">Quantity</FieldLabel>
                                    <Input
                                        id="part-quantity"
                                        name={field.name}
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={String(field.state.value)}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value === "" ? (1 as any) : Number(e.target.value))}
                                        aria-invalid={isInvalid}
                                        aria-required
                                        inputMode="numeric"
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="partOtherInformation"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="part-other-information">Other information</FieldLabel>
                                    <Textarea
                                        id="part-other-information"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="Enter your other information"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                </FieldGroup>
            </FieldSet>
            <FieldSet>
                <FieldLegend>Additional Information</FieldLegend>
                <FieldGroup>
                    <form.Field
                        name="engineSize"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="engine-size">Engine size</FieldLabel>
                                    <Textarea
                                        id="engine-size"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="Enter engine size (e.g., 2.0L)"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                    <form.Field
                        name="comments"
                        children={(field) => {
                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor="comments">Comments</FieldLabel>
                                    <Textarea
                                        id="comments"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="Enter any additional comments"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
                </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <Field orientation="responsive">
                <Button type="submit">Submit</Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            </Field>
        </FieldGroup>
    </form>
}

// Part numbers
// Disclaimer
// Disclaimer - time to contacxt 
// Q/A Common Asked - Information Proceess (How it Works) - External Sources Dilays (Courioir Inofmration )