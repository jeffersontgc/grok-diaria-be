// ormconfig.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv'; // Para cargar variables de .env en desarrollo

config(); // Carga las variables de entorno en process.env. En Render, ya estarán ahí.

// Usamos process.env directamente, no ConfigService, porque este archivo es para la CLI de TypeORM.
const source = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST, // Acceso directo a variables de entorno
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10), // ¡IMPORTANTE! Asegúrate de parsear a número y dar un default
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  logging: false,
  migrations: [__dirname + '/src/database/migrations/*.ts'], // Asegúrate de que esta ruta sea correcta desde la raíz de tu proyecto
  migrationsTableName: 'migrations',
  entities: [__dirname + '/src/**/*.entity.ts'], // Asegúrate de que esta ruta sea correcta desde la raíz de tu proyecto
});

export default source;
