import { LoadStrategy, Reference } from "@mikro-orm/core";

import { orm, Action, Pet, User } from "./config";

(async () => {
    const { em: _em, migrator } = await Promise.resolve(orm);

    const em = _em.fork();

    // 10 users
    for (let i = 0; i < 10; i++) {
        const user = new User();

        // 10 pets
        for (let i = 0; i < 10; i++) {
            const pet = new Pet("name - " + Math.random().toString());
            pet.User = Reference.create(user);

            // 10 actions
            for (let i = 0; i < 10; i++) {
                const action = new Action("name - " + Math.random().toString());
                pet.Action = Reference.create(action);
                em.persist(action);
            }

            em.persist(pet);
        }

        em.persist(user);
    }

    await em.flush();
    em.clear();

    // 1 - simple working query (em.find)
    const simpleFind = await em.find(
        User,
        {},
        {
            strategy: LoadStrategy.JOINED, // does not matter which strategy
            populate: ["Pets"],
            limit: 2, // with or without, works
        }
    );

    console.log(JSON.parse(JSON.stringify({ simpleFind })));

    em.clear();

    // 2 - populateWhere find JOINED
    const populateWhereJoined = await em.find(
        User,
        {},
        {
            populate: ["Pets"],
            populateWhere: {
                Pets: {
                    name: {
                        // should populate all pets ?
                        $like: "name%",
                    },
                },
            },
            strategy: LoadStrategy.JOINED,
        }
    );

    // this ignores the populateWhere filter as it seems
    // select ... from "user" as "u0" left join "pet" as "p1" on "u0"."id" = "p1"."user_id"

    console.log(JSON.parse(JSON.stringify({ populateWhereJoined })));

    em.clear();

    // 3 - populateWhere find SELECT_IN
    const populateWhereSelectIn = await em.find(
        User,
        {},
        {
            populate: ["Pets"],
            populateWhere: {
                Pets: {
                    name: "yoyo",
                },
            },
            strategy: LoadStrategy.SELECT_IN,
        }
    );

    // [query] select "u0".* from "user" as "u0" [took 1 ms]
    // [query] select "p0".* from "pet" as "p0" where "p0"."user_id" in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30) and "p0"."name" = 'yoyo' order by "p0"."user_id" asc

    // this works as intended, most users have 0 pets, while some have 1 with the name "yoyo"
    console.log(JSON.parse(JSON.stringify({ populateWhereSelectIn })));

    em.clear();

    // 4 - populateWhere pagination JOINED
    const [paginationJoined] = await em.findAndCount(
        User,
        {},
        {
            strategy: LoadStrategy.JOINED,
            populate: ["Pets"],
            populateWhere: {
                Pets: {
                    name: "yoyo",
                },
            },
            limit: 30, // will test with and without below
        }
    );

    // with limit: 30

    // [query] select count(*) as "count" from "user" as "u0" [took 1 ms]
    // [query] select "u0"."id", "p1"."id" as "p1__id", "p1"."name" as "p1__name", "p1"."user_id" as "p1__user_id", "p1"."action_id" as "p1__action_id" from "user" as "u0" left join "pet" as "p1" on "u0"."id" = "p1"."user_id" where "u0"."id" in (select "u0"."id" from (select "u0"."id" from "user" as "u0" left join "pet" as "p1" on "u0"."id" = "p1"."user_id" group by "u0"."id" limit 2) as "u0") and "p1"."name" = 'yoyo' [took 2 ms]

    // the weird thing is that here I can see that the query is trying to fetch the pets with the name "yoyo"
    // but in the second (2 - populateWhere find JOINED) example, it did not even try

    // weird, it fetched only one record where the populateWhere filter was found
    console.log(JSON.parse(JSON.stringify({ paginationJoined }))); // { paginationJoined: [ { id: 12, Pets: [Array] } ] }

    // without limit: 30

    // the results and query is the same the second query, (2 - populateWhere find JOINED)

    em.clear();

    // 5 - populateWhere pagination SELECT_IN
    const [paginationSelectIn] = await em.findAndCount(
        User,
        {},
        {
            strategy: LoadStrategy.SELECT_IN,
            populate: ["Pets"],
            populateWhere: {
                Pets: {
                    name: "yoyo",
                },
            },
            limit: 30,
        }
    );

    // everything works as expected here
    console.log(JSON.parse(JSON.stringify({ paginationSelectIn })));

    // conclusion
    // no problems with the SELECT_IN (at least from my testing)

    // JOINED in the second example seems to ignore populateWhere, expected behavior?
    // but if it is expected, then why does populateWhere kinda work when using limit (4 example) ?

    // shouldn't the resulting users and their pets be the same no matter which LoadStrategy you use
})();
