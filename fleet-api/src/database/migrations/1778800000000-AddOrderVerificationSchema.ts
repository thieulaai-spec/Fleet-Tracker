import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderVerificationSchema1778800000000 implements MigrationInterface {
  name = 'AddOrderVerificationSchema1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."order_verifications_step_enum" AS ENUM('accept', 'pickup', 'checkpoint', 'delivery')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "order_id" uuid NOT NULL, 
        "step" "public"."order_verifications_step_enum" NOT NULL, 
        "fingerprint_status" boolean NOT NULL DEFAULT false, 
        "face_photo_url" text, 
        "cargo_photo_url" text, 
        "location" geography(Point,4326), 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        CONSTRAINT "PK_order_verifications" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_verifications" ADD CONSTRAINT "FK_order_verifications_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_verifications" DROP CONSTRAINT "FK_order_verifications_order_id"`,
    );
    await queryRunner.query(`DROP TABLE "order_verifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."order_verifications_step_enum"`,
    );
  }
}
