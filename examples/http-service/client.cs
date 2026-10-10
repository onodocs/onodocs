using System.Net.Http.Headers;
using System.Text.Json;

using var client = new HttpClient { BaseAddress = new Uri(Environment.GetEnvironmentVariable("ONODOCS_SERVICE_URL") ?? "http://127.0.0.1:5191") };
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("ONODOCS_SERVICE_TOKEN") ?? throw new InvalidOperationException("Set ONODOCS_SERVICE_TOKEN."));
using var content = new ByteArrayContent(await File.ReadAllBytesAsync(args[0]));
using var opened = await client.PostAsync("/documents", content);
opened.EnsureSuccessStatusCode();
using var document = await JsonDocument.ParseAsync(await opened.Content.ReadAsStreamAsync());
var url = document.RootElement.GetProperty("url").GetString() ?? throw new InvalidOperationException("Missing document URL.");
try { await File.WriteAllBytesAsync(args[1], await client.GetByteArrayAsync(url + "/pdf")); }
finally { using var removed = await client.DeleteAsync(url); removed.EnsureSuccessStatusCode(); }
