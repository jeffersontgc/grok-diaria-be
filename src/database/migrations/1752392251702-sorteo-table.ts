import { MigrationInterface, QueryRunner } from "typeorm";

export class SorteoTable1752392251702 implements MigrationInterface {
    name = 'SorteoTable1752392251702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sorteo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uuid" uuid NOT NULL, "drawDate" character varying NOT NULL, "drawTime" character varying NOT NULL, "drawNumber" character varying NOT NULL, "winningNumber" integer NOT NULL, "multiplier" character varying NOT NULL, "multiplierValue" integer NOT NULL, CONSTRAINT "UQ_de359378881e4f7190e993b5b56" UNIQUE ("uuid"), CONSTRAINT "PK_bceabbfbd982f671b4bce79960b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sorteo"`);
    }

}
