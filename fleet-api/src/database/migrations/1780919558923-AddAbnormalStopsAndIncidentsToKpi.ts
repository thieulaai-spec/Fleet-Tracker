import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAbnormalStopsAndIncidentsToKpi1780919558923 implements MigrationInterface {
  name = 'AddAbnormalStopsAndIncidentsToKpi1780919558923';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_44d36110fb38f45c2f15c946ddb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_ab4b806373c2ee43946679d572e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_verifications" DROP CONSTRAINT "FK_order_verifications_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_kpi" ADD "abnormal_stops" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_kpi" ADD "incidents" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "status" SET DEFAULT 'available'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "recipient_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "recipient_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "recipient_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "recipient_phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "category" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "priority" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ALTER COLUMN "vehicle_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ALTER COLUMN "driver_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_ab4b806373c2ee43946679d572e" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_44d36110fb38f45c2f15c946ddb" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_verifications" ADD CONSTRAINT "FK_3382608d821ef2b60bb32629fda" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_verifications" DROP CONSTRAINT "FK_3382608d821ef2b60bb32629fda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_44d36110fb38f45c2f15c946ddb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_ab4b806373c2ee43946679d572e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ALTER COLUMN "driver_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ALTER COLUMN "vehicle_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "priority" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "category" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "recipient_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "recipient_phone" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "recipient_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "recipient_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "status" SET DEFAULT 'off_duty'`,
    );
    await queryRunner.query(`ALTER TABLE "driver_kpi" DROP COLUMN "incidents"`);
    await queryRunner.query(
      `ALTER TABLE "driver_kpi" DROP COLUMN "abnormal_stops"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_verifications" ADD CONSTRAINT "FK_order_verifications_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_ab4b806373c2ee43946679d572e" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_44d36110fb38f45c2f15c946ddb" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
