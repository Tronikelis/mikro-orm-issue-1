import { Migration } from '@mikro-orm/migrations';

export class Migration20221224090027 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "action" ("id" serial primary key, "name" text not null);');

    this.addSql('create table "user" ("id" serial primary key);');

    this.addSql('create table "pet" ("id" serial primary key, "user_id" int null, "action_id" int null);');

    this.addSql('alter table "pet" add constraint "pet_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;');
    this.addSql('alter table "pet" add constraint "pet_action_id_foreign" foreign key ("action_id") references "action" ("id") on update cascade on delete set null;');
  }

}
