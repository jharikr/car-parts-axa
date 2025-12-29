import { blob, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

type OrderStatus = "pending" | "reviewing" | "quoted" | "completed"

export const ordersTable = sqliteTable("orders", {
    id: int().primaryKey({ autoIncrement: true }),

    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),

    mechanicName: text("mechanic_name").notNull(),
    mechanicPhone: text("mechanic_phone").notNull(),
    mechanicEmail: text("mechanic_email"),

    status: text().$type<OrderStatus>().notNull().default("pending"),

    customerComments: text("customer_comments"),
    adminNotes: text("admin_notes"),

    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const vehiclesTable = sqliteTable("vehicles", {
    id: int().primaryKey({ autoIncrement: true }),
    orderId: int("order_id")
        .notNull()
        .unique()
        .references(() => ordersTable.id, { onDelete: "cascade" }),

    make: text().notNull(),
    model: text().notNull(),
    year: text().notNull(), // was int
    vin: text(),
});

export const orderPartsTable = sqliteTable("order_parts", {
    id: int().primaryKey({ autoIncrement: true }),
    orderId: int("order_id")
        .notNull()
        .references(() => ordersTable.id, { onDelete: "cascade" }),

    name: text().notNull(),
    description: text().notNull(),
    quantity: int().notNull().default(1),
});

export const orderImagesTable = sqliteTable("order_images", {
    id: int().primaryKey({ autoIncrement: true }),
    orderPartId: int("order_part_id")
        .notNull()
        .references(() => orderPartsTable.id, { onDelete: "cascade" }),

    imageBlob: blob("image_blob").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});