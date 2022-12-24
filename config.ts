import {
    Collection,
    IdentifiedReference,
    LoadStrategy,
    MikroORM,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryKey,
    Property,
} from "@mikro-orm/core";

import { PostgreSqlDriver } from "@mikro-orm/postgresql";

@Entity()
export class User {
    @PrimaryKey()
    id!: number;

    @OneToMany(() => Pet, (p) => p.User)
    Pets = new Collection<Pet>(this);
}

@Entity()
export class Pet {
    @PrimaryKey()
    id!: number;

    @Property({ type: "text", default: "yo" })
    name: string;

    @ManyToOne(() => User, {
        ref: true,
        nullable: true,
    })
    User: IdentifiedReference<User> | null = null;

    @ManyToOne(() => Action, {
        ref: true,
        nullable: true,
    })
    Action: IdentifiedReference<Action> | null = null;

    constructor(name: string) {
        this.name = name;
    }
}

@Entity()
export class Action {
    @PrimaryKey()
    id!: number;

    @Property({ type: "text" })
    name: string;

    @OneToMany(() => Pet, (p) => p.Action)
    Pets = new Collection<Pet>(this);

    constructor(name: string) {
        this.name = name;
    }
}

export const orm = MikroORM.init<PostgreSqlDriver>({
    dbName: "issue-test-delete",
    user: "postgres",
    host: "localhost",
    password: "donatas",
    port: 5432,
    type: "postgresql",
    entities: [User, Action, Pet],
    loadStrategy: LoadStrategy.JOINED,
    migrations: { path: "./migrations", emit: "ts" },
    debug: true,
});
