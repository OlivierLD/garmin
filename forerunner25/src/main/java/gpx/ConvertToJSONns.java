package gpx;

import oracle.xml.parser.v2.DOMParser;
import oracle.xml.parser.v2.NSResolver;
import oracle.xml.parser.v2.XMLDocument;
import oracle.xml.parser.v2.XMLElement;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.File;
import java.io.FileOutputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class ConvertToJSONns
{
  private final static String DATA_FILE = "data.gpx";
  private static final DateFormat GPX_FMT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
  static {
    GPX_FMT.setTimeZone(TimeZone.getTimeZone("etc/UTC"));
  }

  private final static double KM_EQUATORIAL_EARTH_RADIUS = 6378.1370D;
  private final static double NM_EQUATORIAL_EARTH_RADIUS = 3443.9184665227D;
  private final static double MILE_EQUATORIAL_EARTH_RADIUS = 3964.0379117464D;

  protected static double haversineRaw(double lat1, double long1, double lat2, double long2) {
    double dlong = Math.toRadians(long2 - long1);
    double dlat = Math.toRadians(lat2 - lat1);
    double a = Math.pow(Math.sin(dlat / 2.0), 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dlong / 2.0), 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return c;
  }

  public static double haversineKm(double lat1, double long1, double lat2, double long2) {
    return haversineRaw(lat1, long1, lat2, long2) * KM_EQUATORIAL_EARTH_RADIUS;
  }

  public static double haversineNm(double lat1, double long1, double lat2, double long2) {
    return haversineRaw(lat1, long1, lat2, long2) * NM_EQUATORIAL_EARTH_RADIUS;
  }

  public static double haversineMile(double lat1, double long1, double lat2, double long2) {
    return haversineRaw(lat1, long1, lat2, long2) * MILE_EQUATORIAL_EARTH_RADIUS;
  }

  /*
 * Parses strings like "2006-05-05T17:35:48.000" + "Z" or UTC Offset like "-10:00"
 * 01234567890123456789012
 * 1         2         3
 * <p>
 * Return a UTC date
 */
  public static long durationToDate(String duration) {
    return durationToDate(duration, null);
  }

  /*
	 * Sample: "2006-05-05T17:35:48.000Z"
	 *          |    |  |  |  |  |  |
	 *          |    |  |  |  |  |  20
	 *          |    |  |  |  |  17
	 *          |    |  |  |  14
	 *          |    |  |  11
	 *          |    |  8
	 *          |    5
	 *          0
	 */
  public static long durationToDate(String duration, String tz)
      throws RuntimeException {
    String yyyy = duration.substring(0, 4);
    String mm = duration.substring(5, 7);
    String dd = duration.substring(8, 10);
    String hh = duration.substring(11, 13);
    String mi = duration.substring(14, 16);
    String ss = duration.substring(17, 19);
    String ms = duration.substring(20, 23);

    float utcOffset = 0F;

    String trailer = duration.substring(19);
    if (trailer.indexOf("+") >= 0 ||
        trailer.indexOf("-") >= 0) {
//    System.out.println(trailer);
      if (trailer.indexOf("+") >= 0)
        trailer = trailer.substring(trailer.indexOf("+") + 1);
      if (trailer.indexOf("-") >= 0)
        trailer = trailer.substring(trailer.indexOf("-"));
      if (trailer.indexOf(":") > -1) {
        String hours = trailer.substring(0, trailer.indexOf(":"));
        String mins = trailer.substring(trailer.indexOf(":") + 1);
        utcOffset = (float) Integer.parseInt(hours) + (float) (Integer.parseInt(mins) / 60f);
      } else
        utcOffset = Float.parseFloat(trailer);
    }
//  System.out.println("UTC Offset:" + utcOffset);

    Calendar calendar = Calendar.getInstance();
    if (utcOffset == 0f && tz != null)
      calendar.setTimeZone(TimeZone.getTimeZone(tz));
    else
      calendar.setTimeZone(TimeZone.getTimeZone("Etc/UTC"));
    try {
      calendar.set(Integer.parseInt(yyyy),
          Integer.parseInt(mm) - 1,
          Integer.parseInt(dd),
          Integer.parseInt(hh),
          Integer.parseInt(mi),
          Integer.parseInt(ss));
      calendar.set(Calendar.MILLISECOND, Integer.parseInt(ms));
    } catch (NumberFormatException nfe) {
      throw new RuntimeException("durationToDate, for [" + duration + "] : " + nfe.getMessage());
    }
    return calendar.getTimeInMillis() - (long) (utcOffset * (3_600_000));
  }

  public static void main(String... args) throws Exception {

    String fName = DATA_FILE;
    if (args.length > 0) {
      fName = args[0];
    }

    DOMParser parser = new DOMParser();

    parser.parse(new File(fName).toURI().toURL());
    XMLDocument doc = parser.getDocument();

    Node docRoot = doc.getDocumentElement();
    if (!"gpx".equals(docRoot.getNodeName())) {
      System.out.println("Oops");
    } else {
      System.out.println("Moving on");

      double prevLat = -Double.MAX_VALUE;
      double prevLng = -Double.MAX_VALUE;
      long prevTime = 0L;
      double maxSpeed = 0D;
      double deltaDist = 0D;
      long deltaT = 0L;

	    NSResolver resolver = string -> "http://www.topografix.com/GPX/1/1";
      NodeList trkPts = doc.selectNodes("//gpx:trkpt", resolver);
      int count = trkPts.getLength();
      System.out.println(String.format("Found %d node(s)", count));
      for (int i=0; i<count; i++) {
        XMLElement el = (XMLElement)trkPts.item(i);
        String lat = el.getAttribute("lat");
        String lon = el.getAttribute("lon");
        String time  = el.selectNodes("./gpx:time", resolver).item(0).getFirstChild().getNodeValue();

        double dLat = Double.parseDouble(lat);
        double dLng = Double.parseDouble(lon);
        Date gpxTime = GPX_FMT.parse(time);
        long lTime = gpxTime.getTime();

        if (prevLat != -Double.MAX_VALUE) {
          long deltaTime = lTime - prevTime; // in milli seconds
          double dist = haversineKm(prevLat, prevLng, dLat, dLng);
          double speed = dist / (deltaTime / 3_600_000d);
//        maxSpeed = Math.max(speed, maxSpeed);
//        System.out.println(String.format("Speed:%.03f km/h", speed));
          if (speed > maxSpeed) {
            maxSpeed = speed;
            deltaDist = dist;
            deltaT = deltaTime;
          }
        }
        prevLat = dLat;
        prevLng = dLng;
        prevTime = lTime;
      }
      System.out.println(String.format("Max Speed: %.03f km/h, time: %d ms, dist: %f m.", maxSpeed, deltaT, (deltaDist * 1_000)));
    }
  }
}
