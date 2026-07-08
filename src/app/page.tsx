export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <p className="mb-3 font-mono text-sm text-neutral-500 dark:text-neutral-400">
          shaostassen.com
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Shao Stassen
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
          Engineer working across embedded systems, robotics, and machine
          learning.
        </p>
        <p className="mt-8 font-mono text-sm text-neutral-500 dark:text-neutral-400">
          Site under construction — being built in the open at{" "}
          <a
            href="https://github.com/shaostassen/shaostassen.com"
            className="underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-100"
          >
            github.com/shaostassen/shaostassen.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
