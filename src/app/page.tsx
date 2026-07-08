export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl">
        <p className="mb-3 font-mono text-sm text-muted">shaostassen.com</p>
        <h1 className="font-display text-display">Shao Stassen</h1>
        <p className="mt-4 text-lg text-muted">
          Engineer working across embedded systems, robotics, and machine
          learning.
        </p>
        <p className="mt-8 font-mono text-sm text-muted">
          Site under construction — being built in the open at{" "}
          <a
            href="https://github.com/shaostassen/shaostassen.com"
            className="text-accent underline underline-offset-4 hover:decoration-2"
          >
            github.com/shaostassen/shaostassen.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
