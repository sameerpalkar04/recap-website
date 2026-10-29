import '../styles.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; {new Date().getFullYear()} Afterword — The Recap Journal</p>
    </footer>
  );
}
