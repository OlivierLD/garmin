package forrunner25;

import oracle.xml.parser.v2.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Date;
import java.text.DateFormat;
import java.text.SimpleDateFormat;

public class ConvertToJSONns
{
  private final static String DATA_FILE = "data.gpx";
  private static final DateFormat GPX_FMT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");

  public static void main(String... args) throws Exception {

    String fName = DATA_FILE;
    if (args.length > 0) {
      fName = args[0];
    }

    DOMParser parser = new DOMParser();

    parser.parse(new File(fName).toURI().toURL());
    XMLDocument doc = parser.getDocument();

    JSONArray jsonRoot = new JSONArray();

    Node docRoot = doc.getDocumentElement();
    if (!"gpx".equals(docRoot.getNodeName())) {
      System.out.println("Oops");
    } else {
      System.out.println("Moving on");
	    NSResolver resolver = string -> "http://www.topografix.com/GPX/1/0";
      NodeList trkPts = doc.selectNodes("//gpx:trkpt", resolver);
      int count = trkPts.getLength();
      System.out.println(String.format("Found %d node(s)", count));
      for (int i=0; i<count; i++) {
        XMLElement el = (XMLElement)trkPts.item(i);
        String lat = el.getAttribute("lat");
        String lon = el.getAttribute("lon");
        String time  = el.selectNodes("./gpx:time", resolver).item(0).getFirstChild().getNodeValue();
        String speed = el.selectNodes("./gpx:speed", resolver).item(0).getFirstChild().getNodeValue();
        JSONObject obj = new JSONObject();
        obj.put("lat", Double.parseDouble(lat));
        obj.put("lon", Double.parseDouble(lon));
        Date gpxTime = GPX_FMT.parse(time);
        obj.put("time", gpxTime.getTime());
        obj.put("speed", Double.parseDouble(speed));
        jsonRoot.put(obj);
      }
      System.out.println(jsonRoot.toString(2));
      FileOutputStream out = new FileOutputStream("out.json");
      out.write(jsonRoot.toString().getBytes());
      out.close();
    }
  }
}
