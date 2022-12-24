import { Migration } from '@mikro-orm/migrations';

export class Migration20221224090802 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "pet" add column "name" text not null default \'yo\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "pet" drop column "name";');
  }

}
