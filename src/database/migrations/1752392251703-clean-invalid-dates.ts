import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanInvalidDates1752392251703 implements MigrationInterface {
  name = 'CleanInvalidDates1752392251703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar registros con drawDate NULL
    await queryRunner.query(`DELETE FROM "sorteo" WHERE "drawDate" IS NULL`);

    // Eliminar registros con drawDate vacío
    await queryRunner.query(`DELETE FROM "sorteo" WHERE "drawDate" = ''`);

    // Convertir formato YYYY-MM-DD a DD/MM/YYYY
    await queryRunner.query(`
      UPDATE "sorteo" 
      SET "drawDate" = 
        CONCAT(
          SUBSTRING("drawDate", 9, 2), '/',
          SUBSTRING("drawDate", 6, 2), '/',
          SUBSTRING("drawDate", 1, 4)
        )
      WHERE "drawDate" SIMILAR TO '[0-9]{4}-[0-9]{2}-[0-9]{2}'
    `);

    console.log('Converted YYYY-MM-DD format to DD/MM/YYYY format');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No podemos restaurar datos eliminados, pero podemos registrar
    console.log('Cannot restore deleted invalid drawDate records');
    // Usar queryRunner para evitar linter error
    await queryRunner.query(`SELECT 1`);
  }
}
