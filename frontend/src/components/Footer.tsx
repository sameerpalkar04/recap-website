import '../styles.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; {new Date().getFullYear()} My TV Shows App. All rights reserved.</p>
    </footer>
  );
}
