import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateDriverProfile1778774590456 implements MigrationInterface {
  name = 'DeduplicateDriverProfile1778774590456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_vehicles_device_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" DROP COLUMN IF EXISTS "full_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" DROP COLUMN IF EXISTS "phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" DROP COLUMN IF EXISTS "avatar_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" character varying`,
    );

    // Add missing device_id, model, and year columns to vehicles
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "device_id" character varying UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "model" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year" integer`,
    );

    // Add missing fingerprint_id column to drivers
    await queryRunner.query(
      `ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "fingerprint_id" character varying UNIQUE`,
    );

    // Add missing pickup_actual_location and delivery_actual_location columns to orders
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_actual_location" geography(Point, 4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_actual_location" geography(Point, 4326)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e752f3ceba2266865a38f0c85c" ON "vehicles" ("device_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e752f3ceba2266865a38f0c85c"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying(50)`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "full_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ADD "avatar_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ADD "phone" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ADD "full_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_vehicles_device_id" ON "vehicles" ("device_id") `,
    );
  }
}
