import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date | null;
} 