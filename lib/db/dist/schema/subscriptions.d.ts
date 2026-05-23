export declare const readerPublisherSubscriptionsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "reader_publisher_subscriptions";
    schema: undefined;
    columns: {
        readerId: import("drizzle-orm/pg-core").PgColumn<{
            name: "reader_id";
            tableName: "reader_publisher_subscriptions";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        publisherId: import("drizzle-orm/pg-core").PgColumn<{
            name: "publisher_id";
            tableName: "reader_publisher_subscriptions";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const readerJournalistSubscriptionsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "reader_journalist_subscriptions";
    schema: undefined;
    columns: {
        readerId: import("drizzle-orm/pg-core").PgColumn<{
            name: "reader_id";
            tableName: "reader_journalist_subscriptions";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        journalistId: import("drizzle-orm/pg-core").PgColumn<{
            name: "journalist_id";
            tableName: "reader_journalist_subscriptions";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=subscriptions.d.ts.map