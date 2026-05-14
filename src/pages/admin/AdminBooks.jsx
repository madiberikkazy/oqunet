import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../../components/MobileShell.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import Fab from "../../components/Fab.jsx";
import { listBooks, deleteBook } from "../../firebase/firestore.js";
import { useCommunity } from "../../contexts/CommunityContext.jsx";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='#dde5ee'/></svg>`);

export default function AdminBooks() {
  const { community } = useCommunity();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [menuFor, setMenuFor] = useState(null);

  async function load() {
    if (!community?.id) return;
    setBooks(await listBooks({ communityId: community.id, search }));
  }
  useEffect(() => { load(); }, [community?.id, search]);

  async function onDelete(id) {
    if (!confirm("Удалить эту книгу?")) return;
    await deleteBook(id);
    setMenuFor(null);
    load();
  }

  if (!community) {
    return <MobileShell><p className="px-6 py-12 text-center text-ink-500">Создайте сообщество, чтобы добавлять книги.</p></MobileShell>;
  }

  return (
    <MobileShell>
      <SearchBar value={search} onChange={setSearch} />
      {books.length === 0 ? (
        <p className="text-ink-500 px-6 py-12 text-center">Книг пока нет.</p>
      ) : (
        <ul className="mt-2">
          {books.map((b) => (
            <li key={b.id} className="flex gap-3 px-4 py-3 border-b border-ink-100">
              <img src={b.coverUrl || FALLBACK} alt="" className="w-12 h-16 rounded-md object-cover" />
              <Link to={`/books/${b.id}`} className="flex-1 min-w-0">
                <h4 className="font-semibold text-[15px] truncate">{b.name}</h4>
                <p className="text-[13px] text-ink-500 truncate">{b.author}</p>
              </Link>
              <div className="relative">
                <button onClick={() => setMenuFor(menuFor === b.id ? null : b.id)} className="icon-btn" aria-label="More">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {menuFor === b.id ? (
                  <div className="absolute right-0 top-12 bg-white shadow-soft rounded-xl py-1 z-10 w-36">
                    <Link to={`/books/${b.id}`} className="block px-3 py-2 text-[14px] hover:bg-ink-100" onClick={() => setMenuFor(null)}>Открыть</Link>
                    <button onClick={() => onDelete(b.id)} className="block w-full text-left px-3 py-2 text-[14px] text-bad hover:bg-badSoft">Удалить</button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Fab to="/books/add" />
    </MobileShell>
  );
}
