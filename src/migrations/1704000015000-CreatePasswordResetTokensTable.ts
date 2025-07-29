import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePasswordResetTokensTable1704000015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
} 