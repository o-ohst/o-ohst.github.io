const LOGO_SLUG: Record<string, string> = {
  Rust: "rust",
  Python: "python",
  TypeScript: "typescript",
  JavaScript: "javascript",
  Kafka: "apachekafka",
  ClickHouse: "clickhouse",
  Kubernetes: "kubernetes",
  PostgreSQL: "postgresql",
  React: "react",
  "React Native": "react",
  Docker: "docker",
  "C++": "cplusplus",
  C: "c",
  Angular: "angular",
  Streamlit: "streamlit",
  FastAPI: "fastapi",
  AWS: "amazonwebservices",
  Redis: "redis",
  Celery: "celery",
  "Node.js": "nodedotjs",
  Pandas: "pandas",
  "Next.js": "nextdotjs",
  Helm: "helm",
  ArgoCD: "argo",
  "Linux / UNIX": "linux",
  Java: "openjdk",
  Go: "go",
  Elixir: "elixir",
  Phoenix: "phoenixframework",
  "C#": "csharp",
  Express: "express",
  MongoDB: "mongodb",
  MySQL: "mysql",
  RabbitMQ: "rabbitmq",
  Elasticsearch: "elasticsearch",
  Flask: "flask",
  Django: "django",
  "Apache Airflow": "apacheairflow",
  TensorFlow: "tensorflow",
  Supabase: "supabase",
  Expo: "expo",
  Git: "git",
  Linux: "linux",
};

export function TechIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const slug = LOGO_SLUG[name];
  if (!slug) return null;
  const url = `url(/logos/${slug}.svg)`;
  return (
    <span
      aria-hidden
      className={`tech-icon ${className ?? ""}`}
      style={{
        display: "inline-block",
        background: "currentColor",
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
