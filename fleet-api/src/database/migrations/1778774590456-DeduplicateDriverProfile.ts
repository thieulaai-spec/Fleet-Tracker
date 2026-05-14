import { MigrationInterface, QueryRunner } from "typeorm";

export class DeduplicateDriverProfile1778774590456 implements MigrationInterface {
    name = 'DeduplicateDriverProfile1778774590456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_vehicles_device_id"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_e752f3ceba2266865a38f0c85c" ON "vehicles" ("device_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e752f3ceba2266865a38f0c85c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "drivers" ADD "avatar_url" character varying`);
        await queryRunner.query(`ALTER TABLE "drivers" ADD "phone" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drivers" ADD "full_name" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_vehicles_device_id" ON "vehicles" ("device_id") `);
    }

}
