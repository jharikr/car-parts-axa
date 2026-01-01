import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useState } from 'react'
import { type } from 'arktype'
import {
    flexRender,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ChevronDownIcon,
    ChevronsLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsRightIcon,
    CheckCircle2Icon,
    LoaderIcon,
    MoreVerticalIcon,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

// TODO: remove dupliacte validator. Tyopes can be imported from the drizzle schema file

// Schema and types using Arktype
const orderSchema = type({
    id: 'number',
    customerName: 'string',
    mechanicName: 'string',
    parts: 'string',
    status: 'string',
    createdAt: 'string',
})

type Order = typeof orderSchema.infer

// Status type for type safety
type OrderStatus = 'pending' | 'reviewing' | 'quoted' | 'completed' // can be imported

// TODO: abstract into a fetchOrders tanstack serverFunction. Insecure otherwise (code expose to the client)
export const Route = createFileRoute('/admin/dashboard/')({
    loader: async () => {
        const { db } = await import('@/server/db/index')
        const {
            ordersTable,
            orderPartsTable,
        } = await import('@/server/db/schema/schema')

        // TODO: single query to fetch all orders and parts via joins
        // Fetch all orders
        const orders = await db.select().from(ordersTable)

        // Fetch all parts
        const parts = await db.select().from(orderPartsTable)

        // Aggregate parts per order
        const ordersWithParts = orders.map((order) => {
            const orderParts = parts.filter((part) => part.orderId === order.id)
            const partsString = orderParts
                .map((part) => `${part.name} (${part.quantity}x)`)
                .join(', ') || 'No parts'

            return {
                id: order.id,
                customerName: order.customerName,
                mechanicName: order.mechanicName,
                parts: partsString,
                status: order.status,
                createdAt: order.createdAt,
            }
        })

        return { orders: ordersWithParts }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { orders } = useLoaderData({ from: '/admin/dashboard/' }) // explicited needed to stated?
    return <OrdersDataTable data={orders} />
}

const columns: ColumnDef<Order>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    data-indeterminate={
                        table.getIsSomePageRowsSelected() &&
                        !table.getIsAllPageRowsSelected()
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: 'Order #',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.id}</div>
        ),
    },
    {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => <div>{row.original.customerName}</div>,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status as OrderStatus
            const statusConfig: Record<OrderStatus, {
                label: string
                icon: typeof LoaderIcon
                variant: 'outline' | 'secondary' | 'default'
            }> = {
                pending: {
                    label: 'Pending',
                    icon: LoaderIcon,
                    variant: 'outline' as const,
                },
                reviewing: {
                    label: 'Reviewing',
                    icon: LoaderIcon,
                    variant: 'outline' as const,
                },
                quoted: {
                    label: 'Quoted',
                    icon: CheckCircle2Icon,
                    variant: 'secondary' as const,
                },
                completed: {
                    label: 'Completed',
                    icon: CheckCircle2Icon,
                    variant: 'default' as const,
                },
            }
            const config = statusConfig[status]
            const Icon = config.icon

            return (
                <Badge variant={config.variant} className="px-1.5">
                    <Icon
                        className={`size-3 ${status === 'completed'
                            ? 'fill-green-500 dark:fill-green-400'
                            : ''
                            }`}
                    />
                    {config.label}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'mechanicName',
        header: 'Mechanic',
        cell: ({ row }) => <div>{row.original.mechanicName}</div>,
    },
    {
        accessorKey: 'parts',
        header: 'Item',
        cell: ({ row }) => (
            // Add Badge to display parts
            <div className="max-w-md truncate" title={row.original.parts}>
                {row.original.parts}
            </div>
        ),
    },

    {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => {
            const date = new Date(row.original.createdAt)
            return (
                <div>
                    {date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </div>
            )
        },
    },
    {
        id: "actions",
        cell: () => (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            size="icon"
                        />
                    }
                >
                    <MoreVerticalIcon />
                    <span className="sr-only">Open menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Make a copy</DropdownMenuItem>
                    <DropdownMenuItem>Favorite</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
]

function OrdersDataTable({ data: initialData }: { data: Order[] }) {
    const [data] = useState(() => initialData)
    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    const table = useReactTable({
        data,
        columns,
        enableSortingRemoval: false,
        getRowId: (row) => row.id.toString(),
        getCoreRowModel: getCoreRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        state: {
            sorting,
            columnVisibility,
            columnFilters,
            pagination,
        },
    })

    return (
        <div className="w-full flex-col gap-6">
            <div className="flex items-center justify-between py-4 lg:py-6">
                <Input
                    aria-label="Filter by name"
                    placeholder="Search..."
                    value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("email")?.setFilterValue(event.target.value)
                    }
                    className="max-w-48 lg:max-w-sm"
                />

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button variant="outline" size="sm" />}
                        >
                            <span>View</span>

                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !== "undefined" &&
                                        column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="**:data-[slot=table-cell]:first:w-8">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                            Rows per page
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        {/* <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeftIcon
                            />
                        </Button> */}
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeftIcon
                            />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRightIcon
                            />
                        </Button>
                        {/* <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRightIcon
                            />
                        </Button> */}

                    </div>
                </div>
            </div>
        </div>
    )
}